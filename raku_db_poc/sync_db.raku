# Simple POC that this script can work as a db conjob

use JSON::Fast;

my $last-processed-line = @*ARGS[0] // 0;

my $db-file  = "db.json";
my $log-file = "queue.json";

my %db = from-json(slurp $db-file);
my @log-lines = slurp($log-file).lines;
my @log-queue = @log-lines[$last-processed-line .. *];

sub process-post(%operation) {
  my $table = %operation<table>;
  my %data  = %operation<data>;

  %db{$table}.push(%data);

  say "POST operation on table '$table':";
  say "  Data: " ~ to-json(%data);
}

sub process-patch(%operation) {
  my $table = %operation<table>;
  my %data  = %operation<data>;

  for %db{$table}.list -> %record {
    if %record<id> == %data<id> {
      %record = %record, %data;

      say "PATCH operation on table '$table':";
      say "  Data: " ~ to-json(%record);
      last;
    }
  }
}

for @log-queue -> $operation-json {
  my %operation = from-json($operation-json);

  given %operation<operation> {
    when 'POST'  { process-post(%operation) }
    when 'PATCH' { process-patch(%operation) }
  }
}

my $pretty-json = to-json(%db, :pretty, :sorted-keys);
spurt $db-file, $pretty-json;
